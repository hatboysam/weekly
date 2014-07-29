require 'json'

# dev or prod
mode = ""

# Decide if we are going to prod or dev 
ARGV.each do |arg|
	mode = arg
	puts "Switching to: #{mode}"
end

# Read the file
manifest_file = File.open('www/manifest.json', 'rb')
manifest_contents = manifest_file.read
manifest_file.close

# Convert to JSON
manifest_json = JSON.parse(manifest_contents)

# Change the key and the client_id
if mode == 'dev'
	# Insert 'key' item
  puts 'Setting key'
  dev_key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnixmj+OZcKCQcKPYj9sOOFmSWgdmitm7r476RA1gcDElgeZdISNThnBN1s5+F4xQ+jpQytCyQgijJSK068+/CqSKeT4oW1reL0vwBZ/lXKUof1GWsuJTB7dmyCimM5C3fCHlE3pBkPWvkFym7A1Ej1DNAmfiuDIFbWTmkTK3PwRARS1KCtcoR/TZ0mSyErzUtVCs3g7ZJyqKPbCQMHTN1xX7nDwHXn+iRDDW9aYxrR5rRsPeKWuTu+X6/Z2aKLN3Vr/njGroAE8K0RyRXxZ0P5ofB81Z5eYSSA2A9JSr+O3EaPN80E47KYaeNx79DDquwZtZQDT5rfl+7I/Iql+//wIDAQAB'
  manifest_json['key'] = dev_key
	
	# Put in development client_id
  puts 'Changing Client ID'
  dev_id = '891667400722-29bmprobaroc0caodd53sddkc1ekt55t.apps.googleusercontent.com'
  manifest_json['oauth2']['client_id'] = dev_id
else
	# Remove 'key' item
  puts 'Removing key'
  manifest_json.delete('key')
	
	# Put in production client_id
  puts 'Changing Client ID'
  prod_id = '891667400722-7l05aa68781vmfheuidm2in1dhp7mvel.apps.googleusercontent.com'
	manifest_json['oauth2']['client_id'] = prod_id
end

# Pretty print and overwrite file
puts 'Writing file...'
new_json = JSON.pretty_generate(manifest_json)
manifest_file = File.open('www/manifest.json', 'w')
manifest_file.write(new_json)
manifest_file.close
puts 'Done.'