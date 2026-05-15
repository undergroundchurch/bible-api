# Makefile for Fourfold Production

IMAGE_NAME = bible-api
CONTAINER_PORT = 3001
HOST_PORT = 3001
SERVICE_NAME = bible-api
REGION = europe-north2

.PHONY: build run rebuild rerun stop clean shell major minor patch deploy

build:
	docker build -f Dockerfile -t $(IMAGE_NAME) .

# Run in detached mode so 'make stop' can find it later
run:
	docker run -d -p $(HOST_PORT):$(CONTAINER_PORT) -e REDIS_HOST=localhost --name $(IMAGE_NAME)-container $(IMAGE_NAME)

rebuild: build

# Improved stop: xargs -r only runs if there is input, avoiding "requires at least 1 argument" errors
stop:
	-docker ps -q --filter ancestor=$(IMAGE_NAME) | xargs -r docker stop
	-docker ps -aq --filter ancestor=$(IMAGE_NAME) | xargs -r docker rm

# Enter the running container
shell:
	docker exec -it $$(docker ps -q --filter ancestor=$(IMAGE_NAME) | head -n 1) bash

rerun: stop build run

clean:
	-docker rmi $(IMAGE_NAME)

# Versioning targets using minor.js
major:
	node minor.js major

minor:
	node minor.js minor

patch:
	node minor.js patch

deploy:
	gcloud run deploy $(SERVICE_NAME) --source . --region $(REGION) --allow-unauthenticated
