import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find({}); //find all products
    res.json({products}); // Return the products in the response
    // Return the products in the response
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
}

export const getFeaturedProducts = async (req, res) => {
  try {
    // Fetch featured products from the database
    let featuredProducts = await redis.get("featured_products")
    if (featuredProducts) {
        return res.json(JSON.parse(featuredProducts));
    }

    // If not found in Redis, fetch from MongoDB
    // .lean() converts the Mongoose document to a plain JavaScript object
    // which is more efficient for read operations
    featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts) {
      return res.status(404).json({
        success: false,
        message: "No featured products found",
      });
    }
    // store in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.error("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, imageUrl, isFeatured } = req.body;

    let cloudinaryResponse = null;
    if (image){
        await cloudinary.uploader.upload(image, {folder: "products"})
    }

    const product = await Product.create({
      name,
      price,
      description,
      imageUrl: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
      category,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error in createProduct controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if(product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]; // this will get the public ID from the image URL
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from Cloudinary");
            } catch (error) {
                console.error("Error deleting image from Cloudinary:", error);
                
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({
            success: true, message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteProduct controller:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error: " , error: error.message,
        });
    }
}

export const getRecommendedProducts = async (req, res) => {

  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      { $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 } 
      } // Project only necessary fields
    ])

    res.json(products)
  } catch (error) {
    console.error("Error in getRecommendedProducts controller:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
}

export const getProductsByCategory = async (req, res) => {
const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json(products);
} catch (error) {
  console.error("Error in getProductsByCategory controller:", error.message);
  res.status(500).json({
    success: false,
    message: "Internal server error: " + error.message,
  });
}
}

export const toggleFeaturedProduct = async (req, res) => {
try {
  const product = await Product.findById(req.params.id);
  if(product) {
    product.isFeatured = !product.isFeatured; // Toggle the isFeatured status
    const updatedProduct = await product.save(); // Save the updated product
    await updateFeaturedProductsCache(); // Update the cache after toggling
    res.json(updatedProduct);
  } else {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  } catch (error) {
  console.error("Error in toggleFeaturedProduct controller:", error.message);
  res.status(500).json({
    success: false,
    message: "Internal server error: " + error.message,
  });
  }
}

async function updateFeaturedProductsCache() {
   try {
    // The lean() method is used to return plain JavaScript objects instead of Mongoose documents this improves performance
     const featuredProducts = await Product.find({ isFeatured: true }).lean();
     await redis.set("featuredProducts", JSON.stringify(featuredProducts));
   } catch (error) {
     console.error("Error updating featured products cache:", error.message);
   }

  }