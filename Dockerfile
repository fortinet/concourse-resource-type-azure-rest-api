FROM node:14-alpine
# ENV NODE_ENV=production  # do not set the NODE_ENV to production level
RUN apk add --no-cache git
RUN mkdir -p /home/concourse
WORKDIR /home/concourse
COPY ["./", "./"]
RUN npm install --silent && npm run make-dist
RUN cp -R scripts/ /opt/resource/
RUN cp -R dist/bin/ /opt/bin/
RUN chmod +x /opt/resource/*
RUN cd /home
RUN rm -rf /home/concourse
