"""
Create a default superuser from environment variables.

Idempotent — safe to run on every deploy. If the user already exists with the
same username, it is left untouched. Drop this file at:

    core/management/commands/create_default_superuser.py

Then add to your Render build / release command:

    python manage.py migrate && python manage.py create_default_superuser

Environment variables (with safe defaults for local dev):
    DJANGO_SUPERUSER_USERNAME   (default: "admin")
    DJANGO_SUPERUSER_EMAIL      (default: "admin@example.com")
    DJANGO_SUPERUSER_PASSWORD   (default: "admin")
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import IntegrityError


class Command(BaseCommand):
    help = "Create a default Django superuser if one does not already exist."

    def add_arguments(self, parser):
        parser.add_argument(
            "--update-password",
            action="store_true",
            help="If the user already exists, reset their password to the env value.",
        )

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin").strip()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin")

        if not username or not password:
            self.stdout.write(self.style.ERROR(
                "Username and password must be non-empty. "
                "Check DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD."
            ))
            return

        existing = User.objects.filter(username=username).first()
        if existing:
            # Make sure the existing user actually has superuser rights.
            changed = False
            if not existing.is_superuser or not existing.is_staff:
                existing.is_superuser = True
                existing.is_staff = True
                changed = True
            if options.get("update_password"):
                existing.set_password(password)
                changed = True
            if changed:
                existing.save()
                self.stdout.write(self.style.SUCCESS(
                    f"Superuser '{username}' updated."
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Superuser '{username}' already exists — skipping."
                ))
            return

        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
        except IntegrityError as exc:
            self.stdout.write(self.style.ERROR(
                f"Failed to create superuser '{username}': {exc}"
            ))
            return

        self.stdout.write(self.style.SUCCESS(
            f"Superuser '{username}' created successfully."
        ))