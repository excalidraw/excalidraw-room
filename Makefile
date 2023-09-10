.PHONY: help dev build

IMAGE=registry.gitlab.com/gang-zoom/gang-excalidraw-svc
TAG ?= dev

help:
	@echo 'Available targets:'
	@echo '  make build'

build:
	docker build --platform linux/amd64 -f Dockerfile -t ${IMAGE}:${TAG} .
	docker push ${IMAGE}:${TAG}
