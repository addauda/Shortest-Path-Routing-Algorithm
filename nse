#!/bin/bash

if [ $# -gt 0 ]; then
    echo "NSE started with $# arguments"
    ./nse-linux386 $1 $2
else
    echo "Please provide required parameters"
fi
