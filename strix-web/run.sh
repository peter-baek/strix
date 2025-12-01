#!/bin/bash

# Strix Web Dashboard Launcher
# Usage: ./run.sh [backend|frontend|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

start_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    cd "$BACKEND_DIR"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt -q

    # Start the server
    echo -e "${GREEN}Backend running at http://localhost:8000${NC}"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

start_frontend() {
    echo -e "${GREEN}Starting frontend dev server...${NC}"
    cd "$FRONTEND_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    # Start the dev server
    echo -e "${GREEN}Frontend running at http://localhost:5173${NC}"
    npm run dev
}

case "${1:-all}" in
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    all)
        echo -e "${YELLOW}Starting Strix Web Dashboard...${NC}"
        echo -e "${YELLOW}Run in separate terminals:${NC}"
        echo "  ./run.sh backend  - Start API server"
        echo "  ./run.sh frontend - Start React app"
        echo ""
        echo "Or install concurrently: npm install -g concurrently"
        echo "Then run: concurrently './run.sh backend' './run.sh frontend'"
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac
