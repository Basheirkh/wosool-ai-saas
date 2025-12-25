# Server Setup via DigitalOcean Console

## Quick Setup Command

Copy and paste this entire command into the DigitalOcean web console (Access > Launch Droplet Console):

```bash
bash -c 'SSH_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCy27WnSeaB9WaQpZIOL7/chYO57EqVOZ+EMtk1iQ5dXcvdUoCI8DvQwYc8R5/gJf6XED5WDO2YHgTxGZvSoXqYTUUosAZEXge7xCxy6+js7lB3YlfK19OWOFra9c//QcOziYarkxv0sizHuW8Js707jrpzE2PuV0LVW7OxLQtF6gIm/+ULH3DQvByozP4zY7jM/p+M26CCCp/RerYkqR8P/z38L0AH38DDfDYsVk4ScaoXkeBBLnHfJKoKff7x3tYbfMfVflMoixwa6fmKKoC8P+kfesuVYttdelID5dQVEwlTHVPO55HjAOUgVuQ/iFVO3rWsm47J9meelJP976wXXJsvbK+GMuA3ybhb6GwooyWjaAhOiWDYaJqQkYB+hxsgCZW8JohIRW2OYFj9cNjjHqZhgV9NCNzrQvbVfj3dNrsGCN4YwScqQ0SoVIIUywQf98fpX4plSDRARVgA5CgkGXG86OgW8u7I+kCA6MKDIoppUzuUZNUz+NQw1idpWr8dhspkQ2lIThMkHAPqJepuDhHdh4bgfJ1DPnm5NbZmLpds+uq4SdRSFB1bYrxOkbBUXAZvPMCgFc7X1OtJaAA6m2JQgFDlZ7SVMtSrO6coGYw4ED+MJV9tq57XUKaZnH6zSYzMoZ3hFA8KNI7Zf2DWeT+bafuLalC89xMeRNDMgw== ubuntu@ubuntu-Dell-G16-7630"; mkdir -p /root/.ssh && chmod 700 /root/.ssh && echo "$SSH_KEY" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && cd /root && rm -rf twenty-crm-enterprise-v1 && apt-get update -qq && apt-get install -y git && git clone https://github.com/Basheirkh/twenty-crm-enterprise-v1.git && cd twenty-crm-enterprise-v1 && echo "✓ Setup complete! Repository cloned to /root/twenty-crm-enterprise-v1"'
```

## Steps:

1. Go to DigitalOcean Dashboard
2. Select your droplet (167.99.20.94)
3. Click "Access" → "Launch Droplet Console"
4. Paste the command above and press Enter
5. Wait for completion

After running this command, you'll be able to SSH to the server and the repository will be cloned.

