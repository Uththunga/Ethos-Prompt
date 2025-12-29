"""
Template Engine - Handlebars-style template processing for prompts
"""
import re
import json
import logging
from typing import Dict, Any, List, Optional, Union, Callable
from dataclasses import dataclass
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

@dataclass
class TemplateVariable:
    name: str
    type: str  # 'text', 'number', 'boolean', 'select', 'multiselect'
    description: str
    required: bool = True
    default_value: Any = None
    options: Optional[List[str]] = None
    validation_pattern: Optional[str] = None

@dataclass
class TemplateValidationResult:
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    missing_variables: List[str]
    unused_variables: List[str]

class TemplateEngine:
    """
    Handlebars-style template engine for prompt processing
    """

    def __init__(self):
        self.variable_pattern = re.compile(r'\{\{([^}]+)\}\}')
        self.helper_pattern = re.compile(r'\{\{#(\w+)\s+([^}]+)\}\}(.*?)\{\{/\1\}\}', re.DOTALL)
        self.conditional_pattern = re.compile(r'\{\{#if\s+(\w+)\}\}(.*?)(?:\{\{#else\}\}(.*?))?\{\{/if\}\}', re.DOTALL)
        self.loop_pattern = re.compile(r'\{\{#each\s+(\w+)\}\}(.*?)\{\{/each\}\}', re.DOTALL)

        # Built-in helpers
        self.helpers: Dict[str, Callable[..., Any]] = {
            'upper': lambda x: str(x).upper(),
            'lower': lambda x: str(x).lower(),
            'capitalize': lambda x: str(x).capitalize(),
            'length': lambda x: len(x) if hasattr(x, '__len__') else 0,
            'default': lambda x, default: x if x else default,
            'join': lambda x, separator=', ': separator.join(str(item) for item in x) if isinstance(x, list) else str(x),
            'format_date': lambda x: datetime.fromisoformat(x).strftime('%Y-%m-%d') if isinstance(x, str) else str(x),
            'truncate': lambda x, length=100: str(x)[:length] + '...' if len(str(x)) > length else str(x)
        }

    def render(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Render template with provided variables
        """
        try:
            # Process helpers first
            rendered = self._process_helpers(template, variables)

            # Process conditionals
            rendered = self._process_conditionals(rendered, variables)

            # Process loops
            rendered = self._process_loops(rendered, variables)

            # Process simple variables
            rendered = self._process_variables(rendered, variables)

            return rendered.strip()

        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            raise TemplateRenderError(f"Template rendering failed: {e}")

    def _process_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """Process simple variable substitutions"""
        def replace_variable(match):
            var_name = match.group(1).strip()

            # Handle nested properties (e.g., user.name)
            if '.' in var_name:
                value = self._get_nested_value(variables, var_name)
            else:
                value = variables.get(var_name, f"{{{{{var_name}}}}}")

            return str(value) if value is not None else ""

        return self.variable_pattern.sub(replace_variable, template)

    def _process_conditionals(self, template: str, variables: Dict[str, Any]) -> str:
        """Process conditional blocks"""
        def replace_conditional(match):
            condition_var = match.group(1).strip()
            if_content = match.group(2)
            else_content = match.group(3) or ""

            condition_value = variables.get(condition_var, False)

            # Evaluate truthiness
            if self._is_truthy(condition_value):
                return if_content
            else:
                return else_content

        return self.conditional_pattern.sub(replace_conditional, template)

    def _process_loops(self, template: str, variables: Dict[str, Any]) -> str:
        """Process loop blocks"""
        def replace_loop(match):
            array_var = match.group(1).strip()
            loop_content = match.group(2)

            array_value = variables.get(array_var, [])

            if not isinstance(array_value, list):
                return ""

            result = []
            for index, item in enumerate(array_value):
                # Create loop context
                loop_variables = variables.copy()
                loop_variables['this'] = item
                loop_variables['@index'] = index
                loop_variables['@first'] = index == 0
                loop_variables['@last'] = index == len(array_value) - 1

                # If item is a dict, merge its properties
                if isinstance(item, dict):
                    loop_variables.update(item)

                # Render loop content with loop variables
                rendered_content = self._process_variables(loop_content, loop_variables)
                result.append(rendered_content)

            return '\n'.join(result)

        return self.loop_pattern.sub(replace_loop, template)

    def _process_helpers(self, template: str, variables: Dict[str, Any]) -> str:
        """Process helper functions"""
        # Simple helper pattern: {{helper_name variable_name}}
        helper_simple_pattern = re.compile(r'\{\{(\w+)\s+([^}]+)\}\}')

        def replace_helper(match):
            helper_name = match.group(1)
            args_str = match.group(2).strip()

            if helper_name in self.helpers:
                # Parse arguments
                args = self._parse_helper_args(args_str, variables)
                try:
                    result = self.helpers[helper_name](*args)
                    return str(result)
                except Exception as e:
                    logger.warning(f"Helper {helper_name} failed: {e}")
                    return f"{{{{{helper_name} {args_str}}}}}"

            # Not a helper, return as-is for variable processing
            return f"{{{{{helper_name} {args_str}}}}}"

        return helper_simple_pattern.sub(replace_helper, template)

    def _parse_helper_args(self, args_str: str, variables: Dict[str, Any]) -> List[Any]:
        """Parse helper function arguments"""
        args = []

        # Split by spaces, but respect quoted strings
        parts = re.findall(r'[^\s"\']+|"[^"]*"|\'[^\']*\'', args_str)

        for part in parts:
            # Remove quotes if present
            if (part.startswith('"') and part.endswith('"')) or (part.startswith("'") and part.endswith("'")):
                args.append(part[1:-1])
            # Check if it's a variable
            elif part in variables:
                args.append(variables[part])
            # Try to parse as number
            elif part.isdigit():
                args.append(int(part))
            elif '.' in part and part.replace('.', '').isdigit():
                args.append(float(part))
            # Boolean values
            elif part.lower() in ['true', 'false']:
                args.append(part.lower() == 'true')
            else:
                # Treat as string literal
                args.append(part)

        return args

    def _get_nested_value(self, obj: Dict[str, Any], path: str) -> Any:
        """Get nested value from object using dot notation"""
        keys = path.split('.')
        current = obj

        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None

        return current

    def _is_truthy(self, value: Any) -> bool:
        """Determine if value is truthy"""
        if value is None or value is False:
            return False
        if isinstance(value, (str, list, dict)) and len(value) == 0:
            return False
        if isinstance(value, (int, float)) and value == 0:
            return False
        return True

    def extract_variables(self, template: str) -> List[str]:
        """Extract all variable names from template"""
        variables = set()

        # Find all variable references
        matches = self.variable_pattern.findall(template)
        for match in matches:
            var_name = match.strip()

            # Skip helpers
            if any(helper in var_name for helper in self.helpers.keys()):
                continue

            # Handle nested properties
            if '.' in var_name:
                var_name = var_name.split('.')[0]

            variables.add(var_name)

        return list(variables)

    def validate_template(self, template: str, variables: Dict[str, Any]) -> TemplateValidationResult:
        """Validate template against provided variables"""
        errors = []
        warnings: List[str] = []

        # Extract required variables from template
        template_variables = self.extract_variables(template)

        # Check for missing variables
        missing_variables = [var for var in template_variables if var not in variables]

        # Check for unused variables
        unused_variables = [var for var in variables.keys() if var not in template_variables]

        # Check template syntax
        try:
            # Test render with empty variables to check syntax
            self.render(template, {var: f"test_{var}" for var in template_variables})
        except Exception as e:
            errors.append(f"Template syntax error: {e}")

        # Validate variable types and patterns
        for var_name, value in variables.items():
            if var_name in template_variables:
                # Add any specific validation logic here
                pass

        is_valid = len(errors) == 0 and len(missing_variables) == 0

        return TemplateValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            missing_variables=missing_variables,
            unused_variables=unused_variables
        )

    def add_helper(self, name: str, func: Callable[..., Any]):
        """Add custom helper function"""
        self.helpers[name] = func

    def get_template_info(self, template: str) -> Dict[str, Any]:
        """Get information about template structure"""
        variables = self.extract_variables(template)

        # Count different template features
        conditionals = len(self.conditional_pattern.findall(template))
        loops = len(self.loop_pattern.findall(template))
        helpers_used = []

        for helper_name in self.helpers.keys():
            if helper_name in template:
                helpers_used.append(helper_name)

        return {
            "variables": variables,
            "variable_count": len(variables),
            "conditionals": conditionals,
            "loops": loops,
            "helpers_used": helpers_used,
            "complexity_score": len(variables) + conditionals * 2 + loops * 3 + len(helpers_used)
        }

class TemplateRenderError(Exception):
    """Exception raised when template rendering fails"""
    pass

# Global instance
template_engine = TemplateEngine()
