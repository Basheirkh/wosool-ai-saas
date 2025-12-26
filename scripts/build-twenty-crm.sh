#!/bin/bash
# ============================================================================
# WOSOOL AI SAAS - TWENTY CRM BUILD SCRIPT
# ============================================================================
# Build custom Twenty CRM Docker image from forked repository
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="wosool-twenty-crm"
IMAGE_TAG="${1:-latest}"
DOCKERFILE_PATH="packages/twenty-docker/twenty/Dockerfile.custom"
BUILD_CONTEXT="./twenty-crm-forked"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_info "Docker is running"
}

# Check if build context exists
check_build_context() {
    if [ ! -d "$BUILD_CONTEXT" ]; then
        log_error "Build context directory not found: $BUILD_CONTEXT"
        exit 1
    fi
    log_info "Build context found: $BUILD_CONTEXT"
}

# Check if Dockerfile exists
check_dockerfile() {
    if [ ! -f "$BUILD_CONTEXT/$DOCKERFILE_PATH" ]; then
        log_error "Dockerfile not found: $BUILD_CONTEXT/$DOCKERFILE_PATH"
        exit 1
    fi
    log_info "Dockerfile found: $BUILD_CONTEXT/$DOCKERFILE_PATH"
}

# Build the Docker image
build_image() {
    log_info "Building Docker image: $IMAGE_NAME:$IMAGE_TAG"
    log_info "This may take 10-20 minutes depending on your system..."
    
    docker build \
        --file "$BUILD_CONTEXT/$DOCKERFILE_PATH" \
        --tag "$IMAGE_NAME:$IMAGE_TAG" \
        --build-arg REACT_APP_SERVER_BASE_URL=http://localhost:3000 \
        --build-arg APP_VERSION=1.0.0 \
        --progress=plain \
        "$BUILD_CONTEXT"
    
    if [ $? -eq 0 ]; then
        log_info "✓ Docker image built successfully: $IMAGE_NAME:$IMAGE_TAG"
    else
        log_error "✗ Docker image build failed"
        exit 1
    fi
}

# Display image information
show_image_info() {
    log_info "Image information:"
    docker images "$IMAGE_NAME:$IMAGE_TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# Main execution
main() {
    log_info "============================================"
    log_info "Wosool AI SaaS - Twenty CRM Build"
    log_info "============================================"
    
    check_docker
    check_build_context
    check_dockerfile
    
    log_info "Starting build process..."
    build_image
    
    show_image_info
    
    log_info "============================================"
    log_info "Build completed successfully!"
    log_info "============================================"
    log_info "To run the image:"
    echo "  docker-compose up -d"
    log_info "To push to registry:"
    echo "  docker tag $IMAGE_NAME:$IMAGE_TAG your-registry/$IMAGE_NAME:$IMAGE_TAG"
    echo "  docker push your-registry/$IMAGE_NAME:$IMAGE_TAG"
}

main "$@"
