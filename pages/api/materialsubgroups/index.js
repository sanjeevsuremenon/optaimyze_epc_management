import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const subgroups = await db.collection('materialsubgroups')
          .find({})
          .sort({ name: 1 })
          .toArray();
        return res.status(200).json(subgroups);
      } catch (error) {
        console.error('Error fetching subgroups:', error);
        return res.status(500).json({ error: 'Failed to fetch subgroups' });
      }

    case 'PUT':
      console.log('Received PUT request body:', req.body);
      try {
        const { id, _id, ...updateData } = req.body;

        if (!id) {
          console.log('Missing ID');
          return res.status(400).json({ error: 'ID is required' });
        }

        if (!updateData.name) {
          console.log('Missing name');
          return res.status(400).json({ error: 'Name is required' });
        }

        if (!updateData.groupId) {
          console.log('Missing groupId');
          return res.status(400).json({ error: 'Group ID is required' });
        }

        const updateDoc = {
          ...updateData,
          groupId: new ObjectId(updateData.groupId),
          updatedAt: new Date()
        };

        console.log('Update document:', updateDoc);
        console.log('Updating subgroup with ID:', id);

        const result = await db.collection('materialsubgroups').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateDoc }
        );

        console.log('Update result:', result);

        if (result.matchedCount === 0) {
          console.log('No document matched the ID');
          return res.status(404).json({ error: 'Subgroup not found' });
        }

        console.log('Update successful');
        return res.status(200).json({ 
          message: 'Subgroup updated successfully',
          result: result
        });

      } catch (error) {
        console.error('Error in PUT handler:', error);
        return res.status(400).json({ 
          error: 'Failed to update subgroup',
          details: error.message 
        });
      }

    case 'POST':
      try {
        const { name, description, groupId } = req.body;

        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }

        if (!groupId) {
          return res.status(400).json({ error: 'Group ID is required' });
        }

        const newSubgroup = {
          name,
          description,
          groupId: new ObjectId(groupId),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('materialsubgroups').insertOne(newSubgroup);
        return res.status(201).json({ 
          message: 'Subgroup created successfully',
          id: result.insertedId 
        });
      } catch (error) {
        console.error('Error creating subgroup:', error);
        return res.status(400).json({ error: 'Failed to create subgroup' });
      }

    case 'DELETE':
      try {
        const { id } = req.body;
        console.log('Deleting subgroup with ID:', id);

        if (!id) {
          return res.status(400).json({ error: 'ID is required for deletion' });
        }

        const result = await db.collection('materialsubgroups').deleteOne({
          _id: new ObjectId(id)
        });

        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Subgroup not found' });
        }

        return res.status(200).json({ 
          message: 'Subgroup deleted successfully',
          result: result
        });
      } catch (error) {
        console.error('Error deleting subgroup:', error);
        return res.status(400).json({ 
          error: 'Failed to delete subgroup',
          details: error.message 
        });
      }

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 