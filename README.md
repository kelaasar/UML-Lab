# Installation
To clone the repository
1. Navigate to the repository homepage at https://github.com/julianaramos/CS130_Project
2. Click the green code drop down menu located at the top of the page 
![image](https://github.com/julianaramos/CS130_Project/assets/99143374/c0aa9816-0990-4cda-a5dd-eb8aae3922ad)
3. Click the copy symbol to copy the repository URL to your clipboard  
![image](https://github.com/julianaramos/CS130_Project/assets/99143374/463d6102-b0f4-4f9f-9564-16dd053694d0)
4. Using the terminal of your choice, navigate to the directory where the project should be cloned
5. Run the command `git clone <paste repository name>`
  
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

