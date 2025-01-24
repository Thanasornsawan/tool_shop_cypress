import SearchPage from '../pages/SearchPage';
import ProductDetailPage from '../pages/ProductDetailPage';

interface ProductParams {
  productName: string;
  quantity?: number;
}

interface ProductDetails {
  name: string;
  price: number;
  initialQuantity: number;
}

export default class ProductFeature {
  private searchPage: SearchPage;
  private productDetailPage: ProductDetailPage;

  constructor() {
    this.searchPage = new SearchPage();
    this.productDetailPage = new ProductDetailPage();
  }

  addProductToCart(params: ProductParams): Cypress.Chainable<ProductDetails> {
    return this.searchPage.search(params.productName).then(exactProductIndex => {
      if (exactProductIndex === -1) {
        throw new Error(`Product "${params.productName}" not found in search results`);
      }

      return this.searchPage.clickProduct(exactProductIndex).then(() => {
        return this.productDetailPage.getProductName().then(name => {
          return this.productDetailPage.getProductPrice().then(price => {            
            const quantityPromise = params.quantity && params.quantity > 1 
              ? this.productDetailPage.increaseQuantity(params.quantity - 1).then(() => null)
              : cy.wrap(null);

            return quantityPromise.then(() => {
              return this.productDetailPage.addToCart().then(() => {
                return this.productDetailPage.getCurrentQuantity().then(currentQuantity => {
                  return {
                    name,
                    price,
                    initialQuantity: currentQuantity
                  };
                });
              });
            });
          });
        });
      });
    });
  }

  addMultipleProductsToCart(products: ProductParams[]): Cypress.Chainable<ProductDetails[]> {
    const addedProducts: ProductDetails[] = [];

    return products.reduce<Cypress.Chainable>((chainable, product) => {
      return chainable.then(() => {
        return cy.visit('/');
      }).then(() => {
        return this.addProductToCart({
          productName: product.productName,
          quantity: product.quantity ?? 1
        });
      }).then((productDetails) => {
        addedProducts.push(productDetails);
        return cy.wrap(addedProducts);
      });
    }, cy.wrap(null));
  }
}