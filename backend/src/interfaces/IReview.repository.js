class IReviewRepository {
  async findPropertyForReview(propiedadId) {
    throw new Error('Método findPropertyForReview() debe ser implementado');
  }

  async findPriorContact(compradorId, propiedadId) {
    throw new Error('Método findPriorContact() debe ser implementado');
  }

  async findByBuyerAndProperty(compradorId, propiedadId) {
    throw new Error('Método findByBuyerAndProperty() debe ser implementado');
  }

  async create(reviewData) {
    throw new Error('Método create() debe ser implementado');
  }

  async findSellerById(vendedorId) {
    throw new Error('Método findSellerById() debe ser implementado');
  }

  async getSellerSummary(vendedorId) {
    throw new Error('Método getSellerSummary() debe ser implementado');
  }

  async findBySellerWithPagination({ vendedorId, skip, limit }) {
    throw new Error('Método findBySellerWithPagination() debe ser implementado');
  }
}

module.exports = IReviewRepository;
