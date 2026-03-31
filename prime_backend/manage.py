import os
import sys

def main():  # <--- This function MUST be defined
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') # or 'prime_backend.settings'
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django.") from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()