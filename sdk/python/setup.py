"""
Setup configuration for RAG Prompt Library Python SDK
"""

from setuptools import setup, find_packages
import os

# Read README file
def read_readme():
    readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "RAG Prompt Library Python SDK"

# Read requirements
def read_requirements():
    requirements_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    if os.path.exists(requirements_path):
        with open(requirements_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return ['httpx>=0.24.0', 'typing-extensions>=4.0.0']

setup(
    name="rag-prompt-library",
    version="1.0.0",
    description="Official Python SDK for the RAG Prompt Library API",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    author="RAG Prompt Library Team",
    author_email="support@rag-prompt-library.com",
    url="https://github.com/rag-prompt-library/sdk-python",
    project_urls={
        "Documentation": "https://docs.rag-prompt-library.com/sdk/python",
        "Source": "https://github.com/rag-prompt-library/sdk-python",
        "Tracker": "https://github.com/rag-prompt-library/sdk-python/issues",
    },
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "pre-commit>=3.0.0",
        ],
        "docs": [
            "sphinx>=6.0.0",
            "sphinx-rtd-theme>=1.2.0",
            "sphinx-autodoc-typehints>=1.22.0",
        ],
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Internet :: WWW/HTTP :: Dynamic Content",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Typing :: Typed",
    ],
    keywords=[
        "rag",
        "prompt",
        "library",
        "ai",
        "llm",
        "api",
        "sdk",
        "machine-learning",
        "artificial-intelligence",
    ],
    license="MIT",
    include_package_data=True,
    zip_safe=False,
)
