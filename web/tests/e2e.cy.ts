import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import NavBarPage from '../pages/NavBarPage';
import CartPage from '../pages/CartPage';
import MyInvoicesPage from '../pages/MyInvoicesPage';
import InvoiceDetailPage from '../pages/InvoiceDetailPage';
import SearchPage from '../pages/SearchPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import userData from '../fixtures/userData.json';

describe('E2E Test - Registration to Invoice Download', () => {
  let registerPage: RegisterPage;
  let loginPage: LoginPage;
  let navBarPage: NavBarPage;
  let cartPage: CartPage;
  let myInvoicesPage: MyInvoicesPage;
  let invoicePage: InvoiceDetailPage;
  let searchPage: SearchPage;
  let productDetailPage: ProductDetailPage;

  let userEmail: string;
  let userPassword: string;
  let productDetails: { name: string; price: number | null };
  let orderDate: string;
  let invoiceNumber: string;

  const generateRandomString = (length: number = 8): string => {
    return Math.random().toString(36).substring(2, length + 2);
  };

  beforeEach(() => {
    registerPage = new RegisterPage();
    loginPage = new LoginPage();
    navBarPage = new NavBarPage();
    cartPage = new CartPage();
    myInvoicesPage = new MyInvoicesPage();
    invoicePage = new InvoiceDetailPage();
    searchPage = new SearchPage();
    productDetailPage = new ProductDetailPage();

    cy.exec('rm -rf web/downloads/*', { failOnNonZeroExit: false });
  });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 10000); // Reset to default timeout
  });

  it('should complete checkout process and verify invoice', () => {
    const randomStr = generateRandomString();
    userEmail = `test_${randomStr}@example.com`;
    userPassword = `Pass${randomStr}123!`;

    productDetails = {
      name: userData.productData.defaultProduct.productName,
      price: null
    };
    orderDate = new Date().toLocaleDateString('en-US');

    // Registration
    cy.step('Register new account');
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 25);

    const registerData = {
      ...userData.userData,
      email: userEmail,
      password: userPassword,
      dateOfBirth
    };

    registerPage.registerUser(registerData);

    // Login
    cy.step('Login with registered account');
    loginPage.login(userEmail, userPassword);
    navBarPage.getUserName().then(displayName => {
      expect(displayName).to.equal(
        `${userData.userData.firstName} ${userData.userData.lastName}`
      );
    });

    // Add product
    cy.step('Add product to cart and complete checkout');
    cy.visit('/');
    searchPage.search(userData.productData.defaultProduct.productName);
    searchPage.clickProduct();
    
    productDetailPage.getProductPrice().then(price => {
      productDetails.price = price;
      
      productDetailPage.getCurrentQuantity().then(currentQty => {
        const targetQty = userData.productData.defaultProduct.quantity;
        if (targetQty > currentQty) {
          productDetailPage.increaseQuantity(targetQty - currentQty);
        }
      });

      productDetailPage.addToCart();
      navBarPage.goToCart();
      cartPage.processToCompleteCheckoutPayment('Cash on Delivery');

      // Get invoice number and chain dependent operations
      cy.step('Get invoice number from order confirmation');
      cartPage.getInvoiceNumberFromConfirmation().then(number => {
        invoiceNumber = number;
        expect(invoiceNumber).to.match(/INV-\d+/);
        
        cy.step('Verify invoice in My Invoices page');
        navBarPage.goToMyInvoices();
        myInvoicesPage.getInvoiceData(invoiceNumber).then(data => {
          const detailDate = Array.isArray(data.date) ? data.date[0] : data.date;
          expect(new Date(detailDate).toLocaleDateString('en-US')).to.equal(orderDate);
          if (productDetails.price !== null) {
            const expectedTotal = (productDetails.price * userData.productData.defaultProduct.quantity).toFixed(2);
            expect(parseFloat(data.total.replace('$', ''))).to.equal(parseFloat(expectedTotal));
          }
        });

        cy.step('Verify invoice details page');
        myInvoicesPage.viewInvoiceDetails(invoiceNumber);
        invoicePage.getInvoiceDetails().then(details => {
          const detailDate = Array.isArray(details.date) ? details.date[0] : details.date;
          expect(details.invoiceNumber).to.equal(invoiceNumber);
          expect(new Date(detailDate).toLocaleDateString('en-US')).to.equal(orderDate);
          expect(details.paymentMethod).to.equal('Cash on Delivery');
        });

        invoicePage.getProductDetails(productDetails.name).then(productInfo => {
          expect(productInfo.quantity).to.equal(userData.productData.defaultProduct.quantity);
          if (productDetails.price !== null) {
            expect(productInfo.unitPrice).to.equal(productDetails.price);
            expect(productInfo.totalPrice).to.equal(productDetails.price * userData.productData.defaultProduct.quantity);
          }
        });

        cy.step('Download and verify invoice PDF');
        Cypress.config('defaultCommandTimeout', 120000);
        invoicePage.downloadPDF(invoiceNumber).then(downloadedFileName => {
          expect(downloadedFileName).to.equal(`${invoiceNumber}.pdf`);
          cy.task('parsePdf', {
            filePath: `web/downloads/${downloadedFileName}`
          }).then((pdfContent: string) => {
            // Extract date from PDF content (assuming format "Invoice Date2025-01-25 16:56:49")
            const pdfDate = pdfContent.match(/Invoice Date(\d{4}-\d{2}-\d{2})/)[1];
            expect(pdfContent).to.include(invoiceNumber);
            expect(new Date(pdfDate).toLocaleDateString('en-US')).to.equal(orderDate);
            expect(pdfContent).to.include(productDetails.name);
            expect(pdfContent).to.include(productDetails.price);
            expect(pdfContent).to.include(productDetails.price * userData.productData.defaultProduct.quantity);
            expect(pdfContent).to.include('cash-on-delivery');
          });
        });
      });
    });
  });
});