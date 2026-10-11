FROM node:22-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git curl jq ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g @openai/codex@0.162.1 \
  && npx --yes playwright@1.62.1 install-deps chromium
ARG AGENT_UID=1000
ARG AGENT_GID=1000
RUN groupmod -o -g $AGENT_GID node \
  && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node
USER ${AGENT_UID}:${AGENT_GID}
WORKDIR /home/agent
ENTRYPOINT ["sleep", "infinity"]
