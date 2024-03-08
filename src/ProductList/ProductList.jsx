import React, { useState, useEffect } from 'react';
import md5 from 'md5';
import CryptoJS from 'crypto-js';

const API_URL = 'http://api.valantis.store:40000/';
const PASSWORD = 'Valantis';
const timestamp = new Date().toISOString().slice(0, 10).split('-').join('');
const data = `${PASSWORD}_${timestamp}`;

const authorizationString = CryptoJS.MD5(data).toString();

export const getStore = async () => {
    try {
        const response = await fetch("http://api.valantis.store:40000/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth': authorizationString },
            body: JSON.stringify({ action: 'get_ids' }),
        });

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    return null;
};

const calculateXAuth = () => {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return md5(`${PASSWORD}_${timestamp}`);
};

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState({ product: '', price: '', brand: '' });

    const fetchProducts = async () => {
        try {
            const xAuth = calculateXAuth();
            const filterParams = {
                action: 'filter',
                params: { ...filter },
            };

            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth': xAuth,
                },
                body: JSON.stringify(filterParams),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            const productIds = result.result;
            const productsData = await getProductsDetails(productIds);
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const getProductsDetails = async (ids) => {
        try {
            if (ids.length === 0) return [];
            const xAuth = calculateXAuth();
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth': xAuth,
                },
                body: JSON.stringify({ action: 'get_items', params: { ids } }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return result.result;
        } catch (error) {
            console.error('Error fetching product details:', error);
            return [];
        }
    };

    const handleFilterChange = (field, value) => {
        setFilter({ ...filter, [field]: value });
        setCurrentPage(1);
    };

    useEffect(() => {
        const fetchTotalPages = async () => {
            try {
                const xAuth = calculateXAuth();
                const response = await fetch(`${API_URL}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Auth': xAuth,
                    },
                    body: JSON.stringify({ action: 'get_ids', params: {} }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                const totalProducts = result.result.length;
                setTotalPages(Math.ceil(totalProducts / 50));
            } catch (error) {
                console.error('Error fetching total products:', error);
            }
        };

        fetchProducts();
        fetchTotalPages();
    }, [currentPage, filter]);

    return (
        <div>
            <h1>Список товаров</h1>
            <div>
                <label htmlFor="filterName">Название:</label>
                <input
                    type="text"
                    id="filterName"
                    value={filter.product}
                    onChange={(e) => handleFilterChange('product', e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="filterPrice">Цена:</label>
                <input
                    type="number"
                    id="filterPrice"
                    value={filter.price}
                    onChange={(e) => handleFilterChange('price', e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="filterBrand">Бренд:</label>
                <input
                    type="text"
                    id="filterBrand"
                    value={filter.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                />
            </div>
            <button onClick={fetchProducts}>Поиск</button>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        ID: {product.id}, Название: {product.product}, Цена: {product.price}, Бренд: {product.brand}
                    </li>
                ))}
            </ul>
            <div>
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    Предыдущая страница
                </button>
                <span> Page {currentPage} of {totalPages} </span>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    Следующая страница
                </button>
            </div>
        </div>
    );
};

export default ProductList;
