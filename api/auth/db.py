import boto3

dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
users_table = dynamodb.Table("umsgc_login")