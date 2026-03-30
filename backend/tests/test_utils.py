import pytest
from app.core.utils import slugify


class TestSlugify:
    def test_slugify_lowercase(self):
        assert slugify("Hola Mundo") == "hola-mundo"

    def test_slugify_special_chars(self):
        assert slugify("Test!@#$%^&*()") == "test"

    def test_slugify_multiple_spaces(self):
        assert slugify("hello   world") == "hello-world"

    def test_slugify_underscores(self):
        assert slugify("hello_world-test") == "hello-world-test"

    def test_slugify_trim(self):
        assert slugify("  hello  ") == "hello"

    def test_slugify_unicode(self):
        assert slugify("café con leche") == "caf-con-leche"

    def test_slugify_numbers(self):
        assert slugify("Python 3.12") == "python-312"
