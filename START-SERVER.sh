#!/bin/bash
# Start local web server for CSS testing
# This allows the CSS coverage tracker to access stylesheets

echo "Starting local web server..."
echo "Open browser to: http://localhost:8000/tournament.html"
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
