#!/bin/bash
set -e

echo "Starting AI Tools Setup for WWC..."

# 1. Install Homebrew (MacOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    echo "Homebrew is already installed."
  fi
else
  echo "Error: This script is intended for MacOS only."
  exit 1
fi

# 2. Install gemini-cli via Homebrew
if ! command -v gemini &> /dev/null; then
  echo "Installing gemini-cli..."
  brew install gemini-cli
else
  echo "gemini-cli is already installed."
fi

# 3. Setup basic gemini auth (using WWC Google Workspace account)
echo "--------------------------------------------------------"
echo "Setting up Gemini authentication."
echo "Please follow the prompts to login with your WWC Google Workspace account."
echo "Once authenticated, please exit Gemini with /quit"
echo "--------------------------------------------------------"
gemini --sandbox false

# 4. Install gemini extensions
echo "Installing extensions..."
# Get the list of installed extensions once to avoid multiple slow calls
INSTALLED_EXTENSIONS=$(gemini extensions list 2>&1)

# Helper function to install an extension if not already present
install_extension() {
  local url=$1
  shift
  if echo "$INSTALLED_EXTENSIONS" | grep -Fq "$url"; then
    echo "Extension $url already installed."
  else
    gemini extensions install "$url" "$@"
  fi
}

#Atlassian
install_extension https://github.com/atlassian/atlassian-mcp-server --auto-update --consent
#Context7
install_extension https://github.com/upstash/context7 --auto-update --consent
#Gemini CLI Security
install_extension https://github.com/gemini-cli-extensions/security --auto-update --consent
#Github
install_extension https://github.com/github/github-mcp-server --auto-update --consent
#MCP Toolbox for Databases
install_extension https://github.com/googleapis/genai-toolbox --auto-update --consent
#Superpowers
install_extension https://github.com/obra/superpowers --auto-update --consent

# 5. Configure extensions (Placeholder)
echo "Configuring extensions..."
# TODO: Set up extension configuration here
# Example: export SOME_API_KEY="..."

echo "--------------------------------------------------------"
echo "AI Tools Setup Complete!"
echo "The project is configured to use the Docker sandbox by default via .gemini/settings.json."
echo "You can now use 'gemini' in your terminal."
echo "--------------------------------------------------------"
