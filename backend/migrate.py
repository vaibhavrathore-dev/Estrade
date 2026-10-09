"""Alembic entry point; configuration never prints database credentials."""
import sys
from alembic.config import Config
from alembic import command
config = Config()
config.set_main_option('script_location', 'alembic')
if __name__ == '__main__':
    if sys.argv[1:] == ['current']:
        command.current(config)
    elif sys.argv[1:] == ['upgrade']:
        command.upgrade(config, 'head')
    else:
        raise SystemExit('Usage: python migrate.py current|upgrade')
