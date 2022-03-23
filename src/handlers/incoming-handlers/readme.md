**New Incoming Message**
1. **None-Private Chat** | ignored [1]
2. **Not-Serving** | sent to [not-serving-handler.js](./not-serving-handler.js) [1]
    - User_Id Out of Range
    - Blocked
    - Un-Approved
3. **On-Registration** | sent to [registration-handler.js](./registration-handler.js) [0]
    - New-User [1]
    - Ongoing-Registration [1]
    - On-Re-Registration [-1]
4. **Registered** | sent to [movie-request-handler.js](./movie-request-handler.js) [-1]
    - commands
    - Looking-For-Movies




