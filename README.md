# Automate Web and API testing with Cypress Typescript

This practice use website https://practicesoftwaretesting.com/ for testing. <br/>
You may want to see detail about API documentation and how to setup web testing on localhost from https://github.com/testsmith-io/practice-software-testing <br/>

## Command to run project
**For debug**
```sh
npm run cy:open
```
**For run with specific browser and record video**
```sh
npm run test:web:spec:headed:chrome "web/tests/search.cy.ts" --env enableVideo=true 
```
![custom 1](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/custom_1.png?raw=true)
![custom 2](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/custom_2.png?raw=true)
![custom 3](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/custom_3.png?raw=true)
![video](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/preview_video.png?raw=true)
**For run with default headless browser**
```sh
npm run test:web
```
![web result](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/web_result.png?raw=true)
![web report](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/web_report.png?raw=true)
![report](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/report.png?raw=true)
**For run only API**
```sh
npm run test:api
npm run test:api:spec "api/tests/user.cy.ts"
```
![api result](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/api_result.png?raw=true)
![api report](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/api_report.png?raw=true)
**For run both web and API**
```sh
npm run test:all
```
![cmd output](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/all_1.png?raw=true)
![cmd output2](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/all_2.png?raw=true)
![merge html](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/merge_html.png?raw=true)