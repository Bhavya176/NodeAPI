// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

// Azure SDK imports
const { AIProjectsClient } = require("@azure/ai-projects");
const { DefaultAzureCredential } = require("@azure/identity");

// ✅ Required environment variables
const AGENT_ID = process.env.AZURE_AGENT_ID;
// const ENDPOINT = process.env.AZURE_AI_PROJECTS_ENDPOINT;
const connectionString = process.env.AZURE_AI_PROJECTS_CONNECTION_STRING;

// ✅ Check for required config
if (!AGENT_ID || !connectionString) {
  throw new Error(
    "Missing AZURE_AGENT_ID or AZURE_AI_PROJECTS_ENDPOINT in .env"
  );
}

// ✅ Create credential using client ID, secret, tenant from .env
const credential = new DefaultAzureCredential();

// ✅ Create the AIProjectsClient using the endpoint URL and credentials
const client = AIProjectsClient.fromConnectionString(
  connectionString,
  new DefaultAzureCredential()
);
console.log("client", client);

// Main function to interact with the Azure Agent
const askAzureAgent = async (userMessage) => {
  try {
    // Step 1: Create a thread
    const thread = await client.agents.createThread();

    // Step 2: Post a user message
    await client.agents.createMessage(thread.id, {
      role: "user",
      content: userMessage,
    });

    // Step 3: Create a run with your agent ID
    let run = await client.agents.createRun(thread.id, AGENT_ID);

    // Step 4: Poll until run is complete
    while (["queued", "in_progress", "requires_action"].includes(run.status)) {
      await new Promise((res) => setTimeout(res, 1000));
      run = await client.agents.getRun(thread.id, run.id);
    }

    // Step 5: Get messages in thread and extract response text
    const messages = await client.agents.listMessages(thread.id);

    const response = messages.data
      .reverse()
      .flatMap((msg) =>
        msg.content.filter((c) => c.type === "text").map((c) => c.text.value)
      )
      .join("\n");

    return response;
  } catch (error) {
    console.error("Azure Agent Error:", error);
    return "Sorry, I couldn't process your message right now.";
  }
};

module.exports = { askAzureAgent };
