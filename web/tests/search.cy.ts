import SearchPage from '../pages/SearchPage';
import ProductDetailPage from '../pages/ProductDetailPage';

describe('Search Page Tests', () => {
  let searchPage: SearchPage;
  let productDetailPage: ProductDetailPage;
  
  beforeEach(() => {
    searchPage = new SearchPage();
    productDetailPage = new ProductDetailPage();
    cy.visit('/');
  });

  it('should filter products by price range using slider', () => {
    const minPrice = 9;
    const maxPrice = 50;

    searchPage.filterPriceRange(minPrice, maxPrice);

    // Verify filtered prices
    searchPage.getSearchResultPrices().then(prices => {
      const numericPrices = prices.map(price => 
        parseFloat(price.replace('$', ''))
      );

      cy.addTestContext('Numeric prices for verification: ' + JSON.stringify(numericPrices));

      // Verify each price is within range
      cy.wrap(numericPrices).each((price: number) => {
        expect(price).to.be.at.least(minPrice);
        expect(price).to.be.at.most(maxPrice);
      });
    });
  });

  it('should sort products by name and price', () => {
    // Sort by name ascending
    searchPage.sortBy('name,asc');
    
    cy.get('.card-title').then($elements => {
      const productNames = Array.from($elements, el => el.textContent?.toLowerCase() || '');
      const sortedNames = [...productNames].sort();
      expect(productNames).to.deep.equal(sortedNames);
    });

    // Sort by price ascending
    searchPage.sortBy('price,asc');
    
    searchPage.getSearchResultPrices().then(prices => {
      const numericPrices = prices.map(price => parseFloat(price.replace('$', '')));
      const sortedPrices = [...numericPrices].sort((a, b) => a - b);
      expect(numericPrices).to.deep.equal(sortedPrices);
    });
  });

  it('should filter by MightyCraft Hardware brand', () => {
    const expectedBrand = 'MightyCraft Hardware';
    
    searchPage.filterByBrand(expectedBrand);

    // Click first result and verify brand
    searchPage.clickProduct();
    productDetailPage.getBrand().then(brand => {
      expect(brand).to.equal(expectedBrand);
    });
  });

  it('should return correct search result count', () => {
    const searchKeyword = 'Long Nose Pliers';
    searchPage.search(searchKeyword);

    cy.get('.card-body').should('have.length', 1);

    // Clear search and verify total increases
    searchPage.clearSearchResult();
    cy.get('.card-body').should('have.length.gt', 1);
  });
});