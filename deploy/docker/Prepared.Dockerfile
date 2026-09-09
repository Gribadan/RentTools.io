ARG BASE_IMAGE
FROM ${BASE_IMAGE}
ARG GIT_COMMIT_SHA
LABEL org.opencontainers.image.source="https://github.com/Gribadan/RentTools.io" \
      org.opencontainers.image.revision="${GIT_COMMIT_SHA}"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 \
    GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
WORKDIR /app
# npm/Prisma/Next already ran in the separately resource-capped container.
# Never commit that container: its transient environment may hold build tokens.
COPY --chown=node:node package.json package-lock.json prisma.config.ts next.config.ts tsconfig.json ./
COPY --chown=node:node .next ./.next
COPY --chown=node:node node_modules ./node_modules
COPY --chown=node:node src ./src
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node public ./public
COPY --chown=node:node content ./content
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
