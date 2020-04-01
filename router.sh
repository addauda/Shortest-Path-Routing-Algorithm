#!/bin/bash

if [ $# -gt 0 ]; then
    echo "Router started with $# arguments"
    node router.js $1 $2 $3 $4
else
    echo "Please provide required parameters"
fi
