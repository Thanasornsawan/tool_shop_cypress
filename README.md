# Automate web testing with Cypress javascript

This practice use website https://practicesoftwaretesting.com/ for testing. <br/>

## Command to run project

```sh
npx cypress run --spec web/tests/e2e.cy.ts
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

**Result**
![e2e video](https://github.com/Thanasornsawan/tool_shop_cypress/tree/main/web/videos/e2e.cy.ts.mp4?raw=true)

![report](https://github.com/Thanasornsawan/tool_shop_cypress/blob/main/pictures/report.png?raw=true)