class PackageItem {
  final String id;
  final String trainerId;
  final String title;
  final String description;
  final int sessionCount;
  final double price;
  final bool isActive;

  const PackageItem({
    required this.id,
    required this.trainerId,
    required this.title,
    required this.description,
    required this.sessionCount,
    required this.price,
    required this.isActive,
  });

  factory PackageItem.fromJson(Map<String, dynamic> json) {
    return PackageItem(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      sessionCount: json['sessionCount'] as int,
      price: (json['price'] as num).toDouble(),
      isActive: json['isActive'] as bool,
    );
  }
}

class UpsertPackageRequest {
  final String title;
  final String description;
  final int sessionCount;
  final double price;

  const UpsertPackageRequest({
    required this.title,
    required this.description,
    required this.sessionCount,
    required this.price,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'sessionCount': sessionCount,
        'price': price,
      };
}
