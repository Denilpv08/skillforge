import re


def slugify(text: str) -> str:
    """Convierte un texto a un slug URL-friendly."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")
