# Installation
  
To install dependencies
1. Open a terminal instance
2. Navigate to the root directory
3. Run the command npm run install-dependencies
  
To add AI functionality  
For security reasons we did not include the id and keys of our own AI, so in order to with the OpenAI Assistants create a new file called `.env` located in the `/server` directory and add the following.

```
OPENAI_API_KEY=<Your OpenAI Key>  
CODE_GENERATOR_ASSISTANT_ID=<Your generator assistant key>  
CODE_EXAMINER_ASSISTANT_ID=<Your examiner assistant key>  
```

# Deployment

To use our app
1. Open a new terminal instance
2. Navigate to the `/server` directory
3. Run the command `npm run start` to start the backend server
4. Open a new terminal instance
5. Navigate to the `/client` directory
6. Run the command `npm run start` to start the frontend server
7. This should open a tab in your browser with the url `localhost:3000` containing the home page of our project.  
![Home Page](https://github.com/julianaramos/CS130_Project/blob/main/wiki_images/How-to-Use-UML-Lab/Home_Page.png)  

