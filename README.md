# Automate Web and API testing with Cypress Typescript

This practice use website https://practicesoftwaretesting.com/ for testing. <br/>
You may want to see detail about API documentation and how to setup web testing on localhost from https://github.com/testsmith-io/practice-software-testing <br/>

## Command to run project

```sh
npm run test:api
npm run test:web
npm run test:api:spec "api/tests/user.cy.ts"
npm run test:all
```

**For debug**
```sh
npm run cy:open
```

**For run with browser**
```sh
npx cypress run --spec web/tests/search.cy.ts --headed --browser chrome
```

**For run with record video**
```sh
npx cypress run --spec web/tests/e2e.cy.ts --env enableVideo=true 
```

**Result** <br/>
https://github.com/Thanasornsawan/tool_shop_cypress/raw/main/web/videos/e2e.cy.ts.mp4

![web result](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/web_result.png?raw=true)
![report](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/report.png?raw=true)

![api result](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/api_result.png?raw=true)