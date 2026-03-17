# Image version matched gemini-cli version
FROM us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.33.2

# Add your custom dependencies or configurations here
# For example:
# RUN apt-get update && apt-get install -y some-package
# COPY ./my-config /app/my-config

# Install uvx for mcp server(s) -- Obsidian MCP, for one
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/home/node/.local/bin:${PATH}"
