NAME=openjscad

CMD=

default: build run

build:
	docker build -t ${NAME} .

bash: CMD=bash
bash: run
	
run:
	docker run -it --rm \
		-v `pwd`/input:/input \
		-v `pwd`/output:/output \
		-p 4000:4000 \
		${NAME} ${CMD}
	
