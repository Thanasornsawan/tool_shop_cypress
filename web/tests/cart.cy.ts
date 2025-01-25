import SearchPage from '../pages/SearchPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import ProductFeature from '../features/ProductFeature';

describe('Cart Page Tests', () => {
  let searchPage: SearchPage;
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;
  let productFeature: ProductFeature;

  beforeEach(() => {
    searchPage = new SearchPage();
    productDetailPage = new ProductDetailPage();
    cartPage = new CartPage();
    productFeature = new ProductFeature();
    cy.visit('/');
  });

  it('should adjust quantities of multiple products and verify totals in cart', () => {
    const productConfigs = [
      { productName: 'Hammer', quantity: 1, newQuantity: 4 },
      { productName: 'Pliers', quantity: 1, newQuantity: 1 }
    ];
   
    productFeature.addMultipleProductsToCart(productConfigs).then((addedProducts) => {
      productDetailPage.goToCart();
   
      // Adjust quantities and verify
      cy.wrap(productConfigs).each((config: { productName: string; quantity: number; newQuantity: number }) => {
        return cartPage.adjustProductQuantity(config.productName, config.newQuantity)
          .then(() => {
            return cartPage.getProductPriceInfo(config.productName)
              .then((cartInfo: { name: string; unitPrice: number; quantity: number; totalPrice: number }) => {
                expect(cartInfo.quantity).to.equal(config.newQuantity);
                expect(Number(cartInfo.totalPrice.toFixed(2)))
                  .to.equal(Number((cartInfo.unitPrice * cartInfo.quantity).toFixed(2)));
              });
          });
       });
   
      // Verify total cart amount 
      cartPage.getCartTotal().then(total => {
        const expectedTotal = 
          addedProducts[0].price * productConfigs[0].newQuantity + 
          addedProducts[1].price * productConfigs[1].newQuantity;
        expect(total).to.be.closeTo(expectedTotal, 0.01);
      });
   
      // Delete first product and verify
      cartPage.deleteProduct(productConfigs[0].productName);
      
      cartPage.getCartTotal().then(finalTotal => {
        const expectedFinal = addedProducts[1].price * productConfigs[1].newQuantity;
        expect(finalTotal).to.be.closeTo(expectedFinal, 0.01);
      });
    });
   });
});