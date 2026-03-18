const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// ==============================
// CATEGORY CONTROLLERS
// ==============================

// @desc    Create a new Category
// @route   POST /api/menu/categories
// @access  Private (Owner/Manager)
const createCategory = async (req, res) => {
  const { name } = req.body;
  
  // Prevent duplicate categories in the same restaurant
  const categoryExists = await Category.findOne({ name, restaurantId: req.user.restaurantId });
  if (categoryExists) return res.status(400).json({ message: 'Category already exists' });

  const category = await Category.create({
    restaurantId: req.user.restaurantId,
    name
  });

  res.status(201).json(category);
};

// ==============================
// MENU ITEM CONTROLLERS
// ==============================

// @desc    Create a new Menu Item
// @route   POST /api/menu/items
// @access  Private (Owner/Manager)
const createMenuItem = async (req, res) => {
  const { categoryId, name, price, image } = req.body;

  // Validate that the category actually belongs to this restaurant (Loophole closed)
  const category = await Category.findOne({ _id: categoryId, restaurantId: req.user.restaurantId });
  if (!category) return res.status(404).json({ message: 'Invalid Category' });

  const menuItem = await MenuItem.create({
    restaurantId: req.user.restaurantId,
    categoryId,
    name,
    price,
    image
  });

  res.status(201).json(menuItem);
};

// @desc    Toggle Menu Item Availability (Enable/Disable) 
// @route   PUT /api/menu/items/:id/status
// @access  Private (Owner/Manager)
const toggleMenuItemStatus = async (req, res) => {
  const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

  if (menuItem) {
    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();
    res.json({ message: `Item is now ${menuItem.isAvailable ? 'Available' : 'Unavailable'}`, menuItem });
  } else {
    res.status(404).json({ message: 'Menu item not found' });
  }
};

// ==============================
// POS OPTIMIZED CONTROLLER
// ==============================

// @desc    Get complete menu aggregated by categories for POS
// @route   GET /api/menu/pos-data
// @access  Private (All Roles - Cashiers, Waiters need this)
const getMenuForPOS = async (req, res) => {
  try {
    // This fetches all categories and their ACTIVE items in one efficient query
    // This ensures the "POS Load Time < 2 Seconds" rule is met [cite: 324]
    const posData = await Category.aggregate([
      { $match: { restaurantId: req.user.restaurantId } },
      {
        $lookup: {
          from: 'menuitems', // Must match MongoDB's auto-pluralized collection name
          let: { catId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$categoryId', '$$catId'] },
                isAvailable: true // Only fetch items they can actually sell
              } 
            }
          ],
          as: 'items'
        }
      }
    ]);

    res.json(posData);
  } catch (error) {
    res.status(500).json({ message: 'Error loading POS data', error: error.message });
  }
};

// @desc    Update Menu Item (Price/Name)
// @route   PUT /api/menu/items/:id
// @access  Private (Owner/Manager)
const updateMenuItem = async (req, res) => {
  const { name, price, categoryId, image } = req.body;
  
  const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
  
  if (menuItem) {
    // Note: Changing this price will NOT affect past orders (handled in Order module)
    menuItem.name = name || menuItem.name;
    menuItem.price = price || menuItem.price;
    menuItem.categoryId = categoryId || menuItem.categoryId;
    menuItem.image = image !== undefined ? image : menuItem.image;

    const updatedItem = await menuItem.save();
    res.json(updatedItem);
  } else {
    res.status(404).json({ message: 'Menu item not found' });
  }
};

module.exports = { 
  createCategory, 
  createMenuItem, 
  toggleMenuItemStatus, 
  updateMenuItem,   
  getMenuForPOS 
};