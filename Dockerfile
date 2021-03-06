FROM node:12.15.0-alpine

WORKDIR /app

COPY . .
RUN apk add --virtual .gyp python3 make g++ \
  && apk add avahi-dev dbus \
  && yarn install --production --no-progress \
  && apk del .gyp

CMD ["/bin/sh", "-c", "dbus-daemon --system && avahi-daemon -D --no-drop-root && /usr/local/bin/yarn start"]
