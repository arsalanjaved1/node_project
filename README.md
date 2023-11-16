# nodeauth
A sample with Nodejs REST API Authentication using different authentication schemes

## ENVIRONMENT SETUP

- Nodejs 20.9.0
- mongodb 7.0.2

- Run => `docker-compose up -d` to start the development stack
- Execute `mongosh "mongodb://localhost:27017/"` in the `mongodb` container
  - Execute `rs.initiate()` to start replication
  - This needs to be done, *only the first time* when you start the stack.
- The node container will use `nodemon` to reflect changes as soon as you make changes in your code
- `mongodb` connection string for **compass** => `mongodb://localhost:27017/?directConnection=true`
- For connection string to be used inside the `node application`, please see the container name and use => `mongodb://<YOUR_MONGODB_CONTAINER_NAME>:27017/?replicaSet=rs1`

## REPOSITORY PUSH RULES

- Please create a separate branch with your work / fixes / additions
- Make a **Pull Request** to merge with **master**
- **Nobody** is allowed to **push** changes to **master** directly