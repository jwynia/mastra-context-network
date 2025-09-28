# Intentional Deno+Node TypeScript Development Environment
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm AS base

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y \
        build-essential \
        curl \
        git \
        cmake \
        pkg-config \
        libssl-dev \
        jq \
        ripgrep \
        bat \
        fd-find \
        hyperfine \
        entr \
        direnv \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Rust for high-performance tools
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Rust-based development tools
RUN cargo install \
    ast-grep \
    tokei \
    sd \
    watchexec-cli

# Install Deno - Our tooling runtime
ENV DENO_VERSION=1.41.0
RUN curl -fsSL https://deno.land/install.sh | sh -s v${DENO_VERSION}
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Install Bun as alternative JS runtime (for benchmarking)
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Install Kuzu database binary
# TODO: Fix Kuzu installation - archive structure changed
# WORKDIR /tmp
# RUN KUZU_VERSION=$(curl -s https://api.github.com/repos/kuzudb/kuzu/releases/latest | jq -r .tag_name) \
#     && curl -L "https://github.com/kuzudb/kuzu/releases/download/${KUZU_VERSION}/kuzu_cli-linux-x86_64.tar.gz" -o kuzu.tar.gz \
#     && tar -xzf kuzu.tar.gz \
#     && mv kuzu /usr/local/bin/kuzu \
#     && chmod +x /usr/local/bin/kuzu

# Install DuckDB for SQL analysis
WORKDIR /tmp
RUN curl -L https://github.com/duckdb/duckdb/releases/latest/download/duckdb_cli-linux-amd64.zip -o duckdb.zip \
    && unzip duckdb.zip \
    && mv duckdb /usr/local/bin/ \
    && chmod +x /usr/local/bin/duckdb \
    && rm duckdb.zip

# Install Node.js global tools for application development
RUN npm install -g \
    @anthropic-ai/claude-code \
    typescript \
    tsx \
    @swc/cli \
    @swc/core \
    esbuild \
    vite \
    vitest \
    prettier \
    eslint \
    typescript-language-server \
    vscode-langservers-extracted \
    @microsoft/api-extractor \
    @microsoft/api-documenter \
    typedoc

# Install Node.js analysis tools
RUN npm install -g \
    dependency-cruiser \
    madge \
    knip \
    syncpack \
    npm-check-updates \
    npkill \
    cost-of-modules \
    bundle-buddy

# Install code transformation tools
RUN npm install -g \
    jscodeshift \
    @ast-grep/cli \
    ts-migrate
    # NOTE: ts-morph-cli doesn't exist - use ts-morph directly if needed

# Create intentional directory structure
RUN mkdir -p \
    /workspace/src \
    /workspace/scripts \
    /workspace/tests \
    /workspace/bench \
    /workspace/.agent \
    /workspace/.kuzu \
    /workspace/.duckdb \
    /workspace/.cache \
    /workspace/.cache/deno \
    && chown -R node:node /workspace

# NOTE: No COPY commands needed - devcontainer mounts project at /workspace/
# All files (config/, scripts/, hooks/) will be available automatically via mount

# Set working directory for when container starts
WORKDIR /workspace

# Install git hooks
RUN mkdir -p /usr/share/git-core/templates/hooks
# TODO: Create git hooks for semantic DB updates after commits
# COPY ../hooks/* /usr/share/git-core/templates/hooks/
# RUN chmod +x /usr/share/git-core/templates/hooks/*
# RUN git config --global init.templatedir '/usr/share/git-core/templates'

# Set up environment variables
ENV KUZU_DB_PATH=/workspace/.kuzu/semantic.db
ENV DUCKDB_PATH=/workspace/.duckdb/metrics.db
ENV DENO_DIR=/workspace/.cache/deno
ENV NODE_ENV=development

# Configure shell for better DX
RUN echo 'eval "$(direnv hook bash)"' >> ~/.bashrc \
    && echo 'alias d="deno task"' >> ~/.bashrc \
    && echo 'alias n="npm run"' >> ~/.bashrc \
    && echo 'alias analyze="deno task analyze"' >> ~/.bashrc \
    && echo 'alias bench="deno bench"' >> ~/.bashrc \
    && echo 'export PS1="🦕🟢 \[\e[34m\]\w\[\e[m\] "' >> ~/.bashrc

WORKDIR /workspace