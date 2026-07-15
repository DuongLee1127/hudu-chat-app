import dns from 'dns';
import mongoose from 'mongoose';

// Local/ISP DNS on some Windows setups refuses SRV queries (querySrv ECONNREFUSED),
// which breaks mongodb+srv:// connection strings. Force public resolvers for Node.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECT_URL || '');
    console.log('Kết nối đến database MongoDB Atlas thành công');
  } catch (error) {
    console.log('Lỗi kết nối đến database', error);
    process.exit(1);
  }
};
