import unittest
import simpy
from gateway import Radio, airtime


class RadioTests(unittest.TestCase):
    def test_received_only_after_airtime(self):
        env, delivered = simpy.Environment(), []
        radio = Radio(env, delivered.append)
        env.process(radio.transmit({'deviceId': 'one'}))
        env.run(until=airtime() / 2)
        self.assertEqual(delivered, [])
        env.run()
        self.assertEqual(delivered, [{'deviceId': 'one'}])

    def test_overlap_drops_both_frames(self):
        env, delivered = simpy.Environment(), []
        radio = Radio(env, delivered.append)
        for name in ['one', 'two']:
            env.process(radio.transmit({'deviceId': name}))
        env.run()
        self.assertEqual(delivered, [])
        self.assertEqual(radio.stats['collisions'], 2)

    def test_total_packet_loss(self):
        env, delivered = simpy.Environment(), []
        radio = Radio(env, delivered.append, loss_rate=1)
        env.process(radio.transmit({'deviceId': 'one'}))
        env.run()
        self.assertEqual(delivered, [])
        self.assertEqual(radio.stats['lost'], 1)


if __name__ == '__main__':
    unittest.main()
