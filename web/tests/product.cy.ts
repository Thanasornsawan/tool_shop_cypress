import SearchPage from '../pages/SearchPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import ProductFeature from '../features/ProductFeature';

describe('Product Page Tests', () => {
    let searchPage: SearchPage;
    let productDetailPage: ProductDetailPage;
    let productFeature: ProductFeature;
    let cartPage: CartPage;

    beforeEach(() => {
        searchPage = new SearchPage();
        productDetailPage = new ProductDetailPage();
        productFeature = new ProductFeature();
        cartPage = new CartPage();
        cy.visit('/');
    });

    it('should search for Long Nose Pliers and verify out of stock behavior', () => {
        const searchKeyword = 'Long Nose Pliers';
        searchPage.search(searchKeyword);
        
        searchPage.getProductPrice(searchKeyword).then(priceFromCard => {
            searchPage.clickProduct();
            productDetailPage.getProductPrice().then(priceFromDetail => {
                expect(priceFromCard).to.equal(priceFromDetail);
                productFeature.verifyProductOutOfStock().then((result) => {
                    expect(result).to.be.true;
                });
            });
        });
    });

    it('should verify related products match main product category', () => {
        // Step 1: Search for "Pliers"
        searchPage.search('Pliers');
        cy.get('.card-body').first().click(); // Click the first product
      
        // Step 2: Get the main category of the first product
        productDetailPage.getCategory().then((mainCategory) => {
          // Step 3: Retrieve related product names
          productDetailPage.getRelatedProductNames().then((products) => {
            // Step 4: Loop through each related product
            products.forEach((_, index) => {
              // Open each related product
              productDetailPage.openRelatedProduct(index);
      
              // Verify the category matches the main category
              productDetailPage.getCategory().should('eq', mainCategory);
      
              // Navigate back to the main product
              cy.go('back');
            });
          });
        });
    });            

    it('should adjust quantity on product detail page and verify cart page match', () => {
        const productConfigs = [
            { productName: 'Hammer', quantity: 3 },
            { productName: 'Pliers', quantity: 2 }
        ];
    
        productFeature.addMultipleProductsToCart(productConfigs).then((addedProducts) => {
            productDetailPage.goToCart();
    
            addedProducts.forEach((product, index) => {
                cartPage.getProductPriceInfo(product.name).then((cartInfo) => {
                    expect(product.initialQuantity).to.equal(cartInfo.quantity);
                    expect(product.name).to.equal(cartInfo.name);
                    expect(product.price).to.equal(cartInfo.unitPrice);
                    expect(Number(cartInfo.totalPrice.toFixed(2))).to.equal(Number((cartInfo.unitPrice * cartInfo.quantity).toFixed(2)));
                });
            });
    
            cartPage.getCartTotal().then((total) => {
                /* method1: use reduce javascript function to calculate
                const expectedTotal = addedProducts.reduce((sum, product, index) => 
                    sum + (product.price * productConfigs[index].quantity), 0);
                */
                // method2: use for-each to calculate
                let expectedTotal = 0;
                addedProducts.forEach((product, index) => {
                    const quantity = productConfigs[index].quantity;
                    expectedTotal += product.price * quantity;
                });
                
                expect(total).to.be.closeTo(expectedTotal, 0.01);
            });
        });
    });
}); 