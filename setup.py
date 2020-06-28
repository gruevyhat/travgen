#!/usr/bin/python

from distutils.core import setup

setup(
    name='travgen',
    version='0.1.0',
    author='gvh',
    author_email='gruevyhat@gmail.com',
    description='Character generation utility for Chthonian Stars RPG.',
    license='http://www.gnu.org/licenses/gpl-2.0.html',
    platforms=['any'],
    url='https://github.com/gruevyhat/travgen',
    keywords=['character generator', 'RPG', 'traveller'],
    packages=['traveller'],
    scripts=['travgen'],
)
