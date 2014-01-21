"""
 Command for dumping all artworks and descriptors
"""
from django.core.management.base import BaseCommand

from graphs.utils import dump_artworks_csv


class Command(BaseCommand):
    args = "<filename>"
    help = "Dump all artworks with denormalized creatros and descriptros"

    def handle(self, *args, **options):
        if args:
            dump_artworks_csv(args[0])
        else:
            dump_artworks_csv()
