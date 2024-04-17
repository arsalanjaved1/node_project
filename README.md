# nodeauth
A sample with Nodejs REST API Authentication using different authentication schemes

## ENVIRONMENT SETUP

| Software   | Version |
| :--------: | :-----: |
| Nodejs     | 20.12.2 |
| mongodb    |  7.0.2  |

- Run => `docker-compose up -d` to start the development stack
- Execute `mongosh "mongodb://localhost:27017/"` in the `mongodb` container
  - Execute `rs.initiate()` to start replication
  - This needs to be done, *only the first time* when you start the stack.
- The node container will use `nodemon` to reflect changes as soon as you make changes in your code
- `mongodb` connection string for **compass** => `mongodb://localhost:27017/?directConnection=true`
- For connection string to be used inside the `node application`, please see the container name and use => `mongodb://<YOUR_MONGODB_CONTAINER_NAME>:27017/?replicaSet=rs1`

## Add iat(issued at time) and exp(expiry time)

- Please don't forget to add `iat` and `exp` to `jwt.sign()` method in the `helpers\token-helper.js` file. Failiure to add iat and exp will result in tokens getting authenticated without any time restrictions.
- ![image](https://github.com/teamcustombranex/nodeauth/assets/148888216/ea09fbf7-523a-43b7-ba75-b1184b8958c1)


## REPOSITORY PUSH RULES

- Please create a separate branch with your work / fixes / additions
- Make a **Pull Request** to merge with **master**
- **Nobody** is allowed to **push** changes to **master** directly

## For testing

- Just get shell access to the REST API container and run `npm test`
- Substitute `/e/node_mobile_auth/nodeauth` with your own Filesystem project path

## Cleaning up

- Run `docker-compose down -v`. This will delete the mongodb volume as well.