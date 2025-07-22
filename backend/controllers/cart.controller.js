import Product from '../models/product.model.js';

export const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItems } });

        //add quantity to each product
        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(cartItem => cartItem.id === product._id);
            return {
                ...product.toJSON(),
                quantity:item.quantity
            }
        });
    } catch (error) {
        console.error("Error in getCartProducts controller:", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const addToCart = async (req, res) => {

    try {
        const { productId } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.id === productId);
        if(existingItem) {
            existingItem.quantity += 1; // Increment quantity if item already exists
        } else {
            user.cartItems.push(productId); // Add new item to cart
        }

        await user.save(); // Save the updated user document
        res.json(user.cartItems);
    
    } catch (error) {
        console.error("Error addingToCart controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if(!productId) {
            user.cartItems = []; // Clear all items if no productId is provided
        } else {
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        await user.save(); // Save the updated user document
        res.json(user.cartItems);
    } catch (error) {
        console.error("Error removingFromCart controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const {id: productId} = req.params;
        const { quantity } = req.body;
        const user = req.user;
        const existingItem = user.cartItems.find(item => item.id === productId);

        if(existingItem) {
            if(quantity === 0) {
                user.cartItems = user.cartItems.filter(item => item.id !== productId); // Remove item if quantity is 0
                await user.save(); // Save the updated user document
                res.json(user.cartItems);
            }

            existingItem.quantity = quantity; // Update the quantity
            await user.save(); // Save the updated user document
            res.json(user.cartItems);
        } else {
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.error("Error in updateQuantity controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

}