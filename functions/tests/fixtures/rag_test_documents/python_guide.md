# Python Programming Guide

## Introduction

Python is a high-level, interpreted programming language known for its simplicity and readability. Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world.

## Getting Started

### Installation

```bash
# Check if Python is installed
python --version

# Install Python on Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3

# Install Python on macOS using Homebrew
brew install python3

# Install Python on Windows
# Download from python.org and run the installer
```

### Your First Python Program

```python
# hello.py
print("Hello, World!")
```

Run it:
```bash
python hello.py
```

## Basic Syntax

### Variables and Data Types

```python
# Numbers
integer_num = 42
float_num = 3.14
complex_num = 1 + 2j

# Strings
single_quote = 'Hello'
double_quote = "World"
multi_line = """This is a
multi-line string"""

# Boolean
is_true = True
is_false = False

# None type
nothing = None

# Lists (mutable)
fruits = ['apple', 'banana', 'cherry']

# Tuples (immutable)
coordinates = (10, 20)

# Dictionaries
person = {
    'name': 'John',
    'age': 30,
    'city': 'New York'
}

# Sets
unique_numbers = {1, 2, 3, 4, 5}
```

### Control Flow

```python
# If-elif-else
age = 18
if age < 13:
    print("Child")
elif age < 20:
    print("Teenager")
else:
    print("Adult")

# For loops
for i in range(5):
    print(i)

for fruit in fruits:
    print(fruit)

# While loops
count = 0
while count < 5:
    print(count)
    count += 1

# List comprehension
squares = [x**2 for x in range(10)]
```

## Functions

### Defining Functions

```python
def greet(name):
    """Greet a person by name."""
    return f"Hello, {name}!"

# Function with default arguments
def power(base, exponent=2):
    return base ** exponent

# Function with variable arguments
def sum_all(*args):
    return sum(args)

# Function with keyword arguments
def create_profile(**kwargs):
    return kwargs

# Lambda functions
square = lambda x: x**2
```

## Object-Oriented Programming

### Classes and Objects

```python
class Dog:
    """A simple Dog class."""
    
    # Class variable
    species = "Canis familiaris"
    
    def __init__(self, name, age):
        """Initialize a Dog instance."""
        self.name = name
        self.age = age
    
    def bark(self):
        """Make the dog bark."""
        return f"{self.name} says Woof!"
    
    def __str__(self):
        """String representation."""
        return f"{self.name} is {self.age} years old"

# Create instances
buddy = Dog("Buddy", 3)
print(buddy.bark())
```

### Inheritance

```python
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        pass

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"
```

## File Handling

```python
# Writing to a file
with open('example.txt', 'w') as f:
    f.write('Hello, World!\n')
    f.write('This is a test.')

# Reading from a file
with open('example.txt', 'r') as f:
    content = f.read()
    print(content)

# Reading line by line
with open('example.txt', 'r') as f:
    for line in f:
        print(line.strip())

# Appending to a file
with open('example.txt', 'a') as f:
    f.write('\nAppended text')
```

## Error Handling

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"An error occurred: {e}")
else:
    print("No errors occurred")
finally:
    print("This always executes")

# Raising exceptions
def validate_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative")
    return age
```

## Popular Libraries

### NumPy - Numerical Computing

```python
import numpy as np

# Create arrays
arr = np.array([1, 2, 3, 4, 5])
matrix = np.array([[1, 2], [3, 4]])

# Array operations
print(arr * 2)
print(np.mean(arr))
print(np.std(arr))
```

### Pandas - Data Analysis

```python
import pandas as pd

# Create DataFrame
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'city': ['New York', 'London', 'Paris']
}
df = pd.DataFrame(data)

# Data operations
print(df.head())
print(df.describe())
filtered = df[df['age'] > 28]
```

### Requests - HTTP Library

```python
import requests

# GET request
response = requests.get('https://api.example.com/data')
data = response.json()

# POST request
payload = {'key': 'value'}
response = requests.post('https://api.example.com/submit', json=payload)
```

## Best Practices

### Code Style (PEP 8)

```python
# Good: descriptive variable names
user_age = 25
total_count = 100

# Bad: unclear names
x = 25
tc = 100

# Good: proper spacing
def calculate_sum(a, b):
    return a + b

# Bad: inconsistent spacing
def calculate_sum(a,b):
    return a+b
```

### Documentation

```python
def calculate_area(length, width):
    """
    Calculate the area of a rectangle.
    
    Args:
        length (float): The length of the rectangle
        width (float): The width of the rectangle
    
    Returns:
        float: The area of the rectangle
    
    Example:
        >>> calculate_area(5, 3)
        15
    """
    return length * width
```

## Testing

```python
import unittest

class TestMathOperations(unittest.TestCase):
    def test_addition(self):
        self.assertEqual(1 + 1, 2)
    
    def test_subtraction(self):
        self.assertEqual(5 - 3, 2)

if __name__ == '__main__':
    unittest.main()
```

## Conclusion

Python is a versatile language suitable for web development, data science, automation, and more. Its simple syntax and extensive library ecosystem make it an excellent choice for beginners and experts alike.

### Key Takeaways

- Python emphasizes code readability
- Dynamic typing makes development faster
- Extensive standard library and third-party packages
- Strong community support
- Suitable for various applications from web to AI

