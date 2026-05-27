import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const groups = await db.collection('materialgroups')
          .find({})
          .sort({ name: 1 })
          .toArray();

        // For each group, fetch its subgroups
        const groupsWithSubgroups = await Promise.all(groups.map(async (group) => {
          const subgroups = await db.collection('materialsubgroups')
            .find({ groupId: group._id })
            .sort({ name: 1 })
            .toArray();
          
          return {
            ...group,
            subgroups
          };
        }));

        return res.status(200).json(groupsWithSubgroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        return res.status(500).json({ error: 'Failed to fetch groups' });
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

        const updateDoc = {
          ...updateData,
          updatedAt: new Date()
        };

        console.log('Update document:', updateDoc);
        console.log('Updating group with ID:', id);

        const result = await db.collection('materialgroups').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateDoc }
        );

        console.log('Update result:', result);

        if (result.matchedCount === 0) {
          console.log('No document matched the ID');
          return res.status(404).json({ error: 'Group not found' });
        }

        console.log('Update successful');
        return res.status(200).json({ 
          message: 'Group updated successfully',
          result: result
        });

      } catch (error) {
        console.error('Error in PUT handler:', error);
        return res.status(400).json({ 
          error: 'Failed to update group',
          details: error.message 
        });
      }

    case 'POST':
      try {
        const { name, description, isService } = req.body;

        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }

        const newGroup = {
          name,
          description,
          isService: isService || false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('materialgroups').insertOne(newGroup);
        return res.status(201).json({ 
          message: 'Group created successfully',
          id: result.insertedId 
        });
      } catch (error) {
        console.error('Error creating group:', error);
        return res.status(400).json({ error: 'Failed to create group' });
      }

    case 'DELETE':
      try {
        const { id } = req.body;
        console.log('Deleting group with ID:', id);

        if (!id) {
          return res.status(400).json({ error: 'ID is required for deletion' });
        }

        // First, delete all subgroups belonging to this group
        await db.collection('materialsubgroups').deleteMany({
          groupId: new ObjectId(id)
        });

        // Then delete the group itself
        const result = await db.collection('materialgroups').deleteOne({
          _id: new ObjectId(id)
        });

        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Group not found' });
        }

        return res.status(200).json({ 
          message: 'Group and its subgroups deleted successfully',
          result: result
        });
      } catch (error) {
        console.error('Error deleting group:', error);
        return res.status(400).json({ 
          error: 'Failed to delete group',
          details: error.message 
        });
      }

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 