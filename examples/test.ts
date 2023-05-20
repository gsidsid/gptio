import GPTIO from "../src/gptio";

// Inputs to "actions" are passed through a single input object
function add({ a, b }: { a: number; b: number }) {
  return a + b;
}

function multiply({ a, b }: { a: number; b: number }) {
  return a * b;
}

const gptio = new GPTIO(
  // OpenAI chat model (gpt-3.5-turbo or gpt-4)
  "gpt-4",
  // Actions to give GPTIO (your functions + descriptions)
  [
    {
      name: "add",
      description: "Adds two numbers together.",
      func: add,
      inputs: [
        {
          name: "a",
          type: "number", // Any valid JSON type
          description: "The first number to add.",
        },
        {
          name: "b",
          type: "number",
          description: "The second number to add.",
        },
      ],
    },
    {
      name: "multiply",
      description: "Multiplies two numbers together.",
      func: multiply,
      inputs: [
        {
          name: "a",
          type: "number",
          description: "The first number to multiply.",
        },
        {
          name: "b",
          type: "number",
          description: "The second number to multiply.",
        },
      ],
    },
  ],
  // Optional custom callbacks for progress reporting or early exits
  {
    beforeAction: (action, input) => {
      // Add custom logic that should be run before each action
      // throw an error to interrupt and end the run
    },
    afterAction: (action, input, result) => {
      // ...run after each action is executed
    },
    afterThought: (thought) => {
      // ...run after each thought is generated
    },
  },
  // GPTIO options
  {
    // enable a built-in JS code execution action using safe-eval
    evaluation: true,
    // print the entire conversation at the end if there's an error
    debug: true,
    // timeout in seconds for the entire run
    timeout: 100,
  }
);

gptio
  .run(
    "Get me the current time and identify if the number of minutes is a prime number."
  )
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });
