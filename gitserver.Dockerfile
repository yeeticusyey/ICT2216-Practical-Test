FROM node:22-alpine

RUN apk add --no-cache git su-exec tini \
    && npm install --global git-http-server \
    && adduser -D -g git git \
    && mkdir -p /var/www/git \
    && chown -R git:git /var/www/git \
    && git config --system user.name "Ethan James D'Cotta" \
    && git config --system user.email "2401416@sit.singaporetech.edu.sg"

COPY git-server-entrypoint.sh /usr/local/bin/git-server-entrypoint
RUN chmod 0755 /usr/local/bin/git-server-entrypoint

WORKDIR /var/www/git
EXPOSE 3000

ENTRYPOINT ["tini", "--", "git-server-entrypoint"]
CMD ["git-http-server", "-p", "3000", "/var/www/git"]

